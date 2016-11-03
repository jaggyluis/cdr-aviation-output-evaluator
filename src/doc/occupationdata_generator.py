
import random


with(open("occupationdata_rand.csv", "w")) as new:

    with(open("occupationdata.csv", "r")) as base:

        base_data = [d.split(",") for d in base]

        head = base_data[0]
        data = base_data[1:]

        new.write(",".join([str(header) for header in head])+'\n')

        for i in range(len(data)):

            for j in range(7, len(data[i])):

                data[i][j] = random.random();

            print "writing line {0} of {1}".format(i, len(data))
            new.write(",".join([str(data[i][j]) for j in range(len(data[i]))])+'\n')
        
print "done"

            
